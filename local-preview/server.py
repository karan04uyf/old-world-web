"""Local community preview. Configure SMTP environment variables before sending OTPs."""
import hashlib, hmac, json, os, re, secrets, smtplib, sqlite3, ssl, time
from email.message import EmailMessage
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from threading import Lock

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
PRIVATE = ROOT / 'private'
PRIVATE.mkdir(exist_ok=True)
DB = PRIVATE / 'community.sqlite3'
SECRET = secrets.token_bytes(32)
LOCK = Lock()
PENDING, LIMITS = {}, {}
with sqlite3.connect(DB) as db:
    db.execute('CREATE TABLE IF NOT EXISTS members (email TEXT PRIMARY KEY, name TEXT NOT NULL, verified_at INTEGER NOT NULL, consent_version TEXT NOT NULL)')

def send_code(email, code):
    msg = EmailMessage()
    msg['Subject'] = 'Your Old World Proof verification code'
    msg['From'] = os.environ['SMTP_FROM']
    msg['To'] = email
    msg.set_content(f'Your verification code is {code}.\nIt expires in 10 minutes.\nIf you did not request this, you can ignore this email.\n\nOld World Proof')
    with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.environ.get('SMTP_PORT', '587')), timeout=15) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
        smtp.send_message(msg)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)

    def log_message(self, *args):
        pass  # Do not log signup data or codes.

    def reply(self, status, message, **extra):
        raw = json.dumps(dict(message=message, **extra)).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        if self.path not in ('/api/signup/request', '/api/signup/verify'):
            return self.reply(404, 'Not found.')
        origin = self.headers.get('Origin', '')
        if not origin or urlsplit(origin).netloc != self.headers.get('Host'):
            return self.reply(403, 'Please submit from this website.')
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 4096: raise ValueError()
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict): raise ValueError()
        except (ValueError, json.JSONDecodeError):
            return self.reply(400, 'Please check your details.')
        now = time.time()
        ip = self.client_address[0]
        with LOCK:
            for key in list(PENDING):
                if PENDING[key]['expires'] < now: del PENDING[key]
            for key in list(LIMITS):
                if LIMITS[key][1] < now: del LIMITS[key]
            count, reset = LIMITS.get(ip, (0, now + 3600))
            if count >= 60: return self.reply(429, 'Too many attempts. Please try again later.')
            LIMITS[ip] = (count + 1, reset)
            if self.path.endswith('/verify'):
                ticket = str(data.get('ticket', ''))
                item = PENDING.get(ticket)
                if not item: return self.reply(400, 'This code has expired. Request a new code.')
                item['attempts'] += 1
                digest = hmac.digest(SECRET, (ticket + str(data.get('code', ''))).encode(), 'sha256')
                if item['attempts'] > 5:
                    del PENDING[ticket]
                    return self.reply(429, 'Too many incorrect codes. Request a new code.')
                if not hmac.compare_digest(item['digest'], digest):
                    return self.reply(400, 'That code is incorrect. Please try again.')
                with sqlite3.connect(DB) as db:
                    db.execute('INSERT OR IGNORE INTO members VALUES (?, ?, ?, ?)', (item['email'], item['name'], int(now), 'community-signup-v1'))
                del PENDING[ticket]
                return self.reply(200, 'Thank you for joining. Your email is verified.')
            email = str(data.get('email', '')).strip().lower()
            name = str(data.get('name', '')).strip()
            if not re.fullmatch(r'[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+', email) or len(email) > 254 or not 1 <= len(name) <= 80 or data.get('consent') is not True:
                return self.reply(400, 'Enter your name, a valid email, and confirm your consent.')
            if not all(os.environ.get(k) for k in ('SMTP_HOST', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASSWORD')):
                return self.reply(503, 'Email verification is not connected yet. Please come back soon or contact oldworldproof@gmail.com.')
            mailkey = 'email:' + email
            n, reset = LIMITS.get(mailkey, (0, now + 3600))
            if n >= 5 or any(x['email'] == email and x['expires'] > now + 540 for x in PENDING.values()):
                return self.reply(429, 'Please wait before requesting another code.')
            LIMITS[mailkey] = (n + 1, reset)
            for key in list(PENDING):
                if PENDING[key]['email'] == email: del PENDING[key]
            ticket, code = secrets.token_urlsafe(32), f'{secrets.randbelow(1000000):06d}'
            PENDING[ticket] = dict(email=email, name=name, expires=now + 600, attempts=0, digest=hmac.digest(SECRET, (ticket + code).encode(), 'sha256'))
        try:
            send_code(email, code)
        except Exception:
            with LOCK: PENDING.pop(ticket, None)
            return self.reply(503, 'We could not send your code. Please try again later.')
        self.reply(200, 'Check your email for a 6-digit code. It expires in 10 minutes.', ticket=ticket)

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('PORT', '8767'))), Handler).serve_forever()
