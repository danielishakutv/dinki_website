#!/bin/bash
# ============================================================
# Dinki Africa — Postfix + Dovecot + OpenDKIM Setup
# Server: 77.237.243.210 (Contabo VPS)
# Domain: dinki.africa
# Purpose: Send AND receive emails
# ============================================================
#
# IMPORTANT: Run each section one at a time, not the whole script.
# Some steps require you to verify output before continuing.
#
# SSH into your VPS first:
#   ssh root@77.237.243.210
# ============================================================


# ────────────────────────────────────────────────────────────
# STEP 1: CHECK WHAT'S ALREADY INSTALLED (Virtualmin likely has Postfix)
# ────────────────────────────────────────────────────────────

echo "=== Checking existing mail packages ==="
dpkg -l | grep -E 'postfix|dovecot|opendkim'
postconf mail_version 2>/dev/null
systemctl is-active postfix 2>/dev/null
systemctl is-active dovecot 2>/dev/null


# ────────────────────────────────────────────────────────────
# STEP 2: INSTALL REQUIRED PACKAGES
# ────────────────────────────────────────────────────────────
# If Postfix is NOT installed, run this. If already installed, skip.

apt update
apt install -y postfix dovecot-core dovecot-imaps dovecot-pop3d \
  opendkim opendkim-tools certbot

# During Postfix install, choose:
#   - "Internet Site"
#   - System mail name: dinki.africa


# ────────────────────────────────────────────────────────────
# STEP 3: SET HOSTNAME
# ────────────────────────────────────────────────────────────

hostnamectl set-hostname mail.dinki.africa
echo "77.237.243.210 mail.dinki.africa mail" >> /etc/hosts


# ────────────────────────────────────────────────────────────
# STEP 4: SSL CERTIFICATE FOR MAIL
# ────────────────────────────────────────────────────────────
# We need a real SSL cert for mail.dinki.africa.
# Since Cloudflare proxies the web domain, we use standalone mode
# with DNS verification for the mail subdomain.
#
# FIRST: In Cloudflare DNS, add an A record:
#   mail.dinki.africa → 77.237.243.210 (DNS only, NOT proxied — grey cloud)
#
# Then run:

certbot certonly --standalone -d mail.dinki.africa \
  --agree-tos --email admin@dinki.africa --non-interactive

# If port 80 is in use by Apache, use webroot instead:
# certbot certonly --webroot -w /var/www/html -d mail.dinki.africa \
#   --agree-tos --email admin@dinki.africa --non-interactive


# ────────────────────────────────────────────────────────────
# STEP 5: CONFIGURE POSTFIX (main.cf)
# ────────────────────────────────────────────────────────────

# Back up original config
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

cat > /etc/postfix/main.cf << 'POSTFIX_MAIN'
# ── Basic settings ──
smtpd_banner = $myhostname ESMTP
biff = no
append_dot_mydomain = no
readme_directory = no
compatibility_level = 3.6

# ── Hostname & domain ──
myhostname = mail.dinki.africa
mydomain = dinki.africa
myorigin = $mydomain
mydestination = $myhostname, dinki.africa, localhost.localdomain, localhost
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 172.16.0.0/12

# ── TLS (incoming) ──
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.dinki.africa/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.dinki.africa/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_session_cache_database = btree:${data_directory}/smtpd_scache

# ── TLS (outgoing) ──
smtp_tls_security_level = may
smtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache

# ── SASL (Dovecot handles auth) ──
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = $myhostname

# ── Restrictions ──
smtpd_helo_required = yes
smtpd_recipient_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    reject_invalid_hostname,
    reject_non_fqdn_hostname,
    reject_non_fqdn_sender,
    reject_non_fqdn_recipient,
    reject_unknown_sender_domain,
    reject_rbl_client zen.spamhaus.org

# ── Mailbox ──
home_mailbox = Maildir/
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = all
inet_protocols = ipv4

# ── OpenDKIM milter ──
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:localhost:8891
non_smtpd_milters = inet:localhost:8891

# ── Message size limit (25MB) ──
message_size_limit = 26214400
POSTFIX_MAIN


# ────────────────────────────────────────────────────────────
# STEP 6: CONFIGURE POSTFIX SUBMISSION PORT (587 for sending)
# ────────────────────────────────────────────────────────────

# Enable submission port in master.cf
cp /etc/postfix/master.cf /etc/postfix/master.cf.backup

# Add submission service (port 587) if not already present
grep -q "^submission" /etc/postfix/master.cf || cat >> /etc/postfix/master.cf << 'MASTER_APPEND'

submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
MASTER_APPEND


# ────────────────────────────────────────────────────────────
# STEP 7: CONFIGURE DOVECOT (IMAP for receiving/reading mail)
# ────────────────────────────────────────────────────────────

# Main Dovecot config
cat > /etc/dovecot/dovecot.conf << 'DOVECOT_CONF'
protocols = imap pop3 lmtp
listen = *, ::
mail_location = maildir:~/Maildir
namespace inbox {
  inbox = yes
}

# SSL
ssl = required
ssl_cert = </etc/letsencrypt/live/mail.dinki.africa/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.dinki.africa/privkey.pem
ssl_min_protocol = TLSv1.2

# Auth
auth_mechanisms = plain login
passdb {
  driver = pam
}
userdb {
  driver = passwd
}

# Postfix SASL integration
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
}

# Logging
log_path = /var/log/dovecot.log
DOVECOT_CONF


# ────────────────────────────────────────────────────────────
# STEP 8: CREATE MAIL USERS
# ────────────────────────────────────────────────────────────
# Create system users for email addresses.
# Each user gets an email: username@dinki.africa

# no-reply user (for sending only, no login shell)
useradd -m -s /usr/sbin/nologin noreply 2>/dev/null
echo "noreply:$(openssl rand -base64 32)" | chpasswd

# admin user (real mailbox you can log into)
useradd -m -s /bin/bash admin 2>/dev/null
echo "Set a strong password for admin@dinki.africa:"
passwd admin

# support user
useradd -m -s /bin/bash support 2>/dev/null
echo "Set a strong password for support@dinki.africa:"
passwd support

# Create Maildir for each user
mkdir -p /home/admin/Maildir/{new,cur,tmp}
chown -R admin:admin /home/admin/Maildir
mkdir -p /home/support/Maildir/{new,cur,tmp}
chown -R support:support /home/support/Maildir
mkdir -p /home/noreply/Maildir/{new,cur,tmp}
chown -R noreply:noreply /home/noreply/Maildir


# ────────────────────────────────────────────────────────────
# STEP 9: CONFIGURE OPENDKIM
# ────────────────────────────────────────────────────────────

# Generate DKIM keys
mkdir -p /etc/opendkim/keys/dinki.africa
opendkim-genkey -b 2048 -d dinki.africa -D /etc/opendkim/keys/dinki.africa/ -s mail -v
chown -R opendkim:opendkim /etc/opendkim/keys/

# OpenDKIM config
cat > /etc/opendkim.conf << 'DKIM_CONF'
Syslog          yes
SyslogSuccess   yes
LogWhy          yes

Canonicalization   relaxed/simple
Domain             dinki.africa
Selector           mail
KeyFile            /etc/opendkim/keys/dinki.africa/mail.private

Socket             inet:8891@localhost
PidFile            /run/opendkim/opendkim.pid
OversignHeaders    From
TrustAnchorFile    /usr/share/dns/root.key
UserID             opendkim

# Sign mail from these domains
InternalHosts      /etc/opendkim/TrustedHosts
ExternalIgnoreList /etc/opendkim/TrustedHosts
KeyTable           /etc/opendkim/KeyTable
SigningTable       refile:/etc/opendkim/SigningTable
DKIM_CONF

# Trusted hosts
cat > /etc/opendkim/TrustedHosts << 'TRUSTED'
127.0.0.1
localhost
dinki.africa
mail.dinki.africa
172.16.0.0/12
TRUSTED

# Key table
cat > /etc/opendkim/KeyTable << 'KEYTABLE'
mail._domainkey.dinki.africa dinki.africa:mail:/etc/opendkim/keys/dinki.africa/mail.private
KEYTABLE

# Signing table
cat > /etc/opendkim/SigningTable << 'SIGNINGTABLE'
*@dinki.africa mail._domainkey.dinki.africa
SIGNINGTABLE

# Fix socket directory
mkdir -p /run/opendkim
chown opendkim:opendkim /run/opendkim

# Also set the socket in default config
echo 'SOCKET="inet:8891@localhost"' > /etc/default/opendkim


# ────────────────────────────────────────────────────────────
# STEP 10: GET YOUR DKIM PUBLIC KEY (for DNS)
# ────────────────────────────────────────────────────────────

echo ""
echo "=== YOUR DKIM PUBLIC KEY (add this to DNS) ==="
echo ""
cat /etc/opendkim/keys/dinki.africa/mail.txt
echo ""
echo "Copy the value inside the parentheses (without quotes) for your DNS TXT record."
echo ""


# ────────────────────────────────────────────────────────────
# STEP 11: OPEN FIREWALL PORTS
# ────────────────────────────────────────────────────────────

# Check if ufw is active
ufw status

# If active, open mail ports:
ufw allow 25/tcp    # SMTP (receive from other servers)
ufw allow 587/tcp   # Submission (authenticated sending)
ufw allow 993/tcp   # IMAPS (secure IMAP for reading mail)
ufw allow 995/tcp   # POP3S (optional, if you want POP3)

# If using iptables directly:
# iptables -A INPUT -p tcp --dport 25 -j ACCEPT
# iptables -A INPUT -p tcp --dport 587 -j ACCEPT
# iptables -A INPUT -p tcp --dport 993 -j ACCEPT


# ────────────────────────────────────────────────────────────
# STEP 12: START AND ENABLE SERVICES
# ────────────────────────────────────────────────────────────

systemctl restart postfix
systemctl restart dovecot
systemctl restart opendkim

systemctl enable postfix
systemctl enable dovecot
systemctl enable opendkim

# Verify all services are running
echo ""
echo "=== Service Status ==="
systemctl is-active postfix && echo "Postfix: RUNNING" || echo "Postfix: FAILED"
systemctl is-active dovecot && echo "Dovecot: RUNNING" || echo "Dovecot: FAILED"
systemctl is-active opendkim && echo "OpenDKIM: RUNNING" || echo "OpenDKIM: FAILED"


# ────────────────────────────────────────────────────────────
# STEP 13: TEST EMAIL SENDING
# ────────────────────────────────────────────────────────────

# Send a test email from command line
echo "Test email from Dinki Africa mail server" | mail -s "Test from dinki.africa" -a "From: no-reply@dinki.africa" YOUR_PERSONAL_EMAIL@gmail.com

# Check mail log for errors
tail -20 /var/log/mail.log


# ────────────────────────────────────────────────────────────
# STEP 14: ADD NODEMAILER TO BACKEND
# ────────────────────────────────────────────────────────────

# SSH into VPS, then:
cd /var/www/dinki/backend

# Install nodemailer in the backend container
docker compose exec dinki-api npm install nodemailer

# OR if you manage dependencies via package.json before building:
# Add to package.json dependencies: "nodemailer": "^6.9.0"
# Then rebuild: docker compose up -d --build

# Copy the email service files into the backend:
# - emailService.js → src/services/emailService.js
# - emailTemplates.js → src/services/emailTemplates.js

# Add these env vars to /var/www/dinki/backend/.env:
# EMAIL_FROM="Dinki Africa" <no-reply@dinki.africa>
# EMAIL_SUPPORT=support@dinki.africa
# FRONTEND_URL=https://dinki.africa


# ────────────────────────────────────────────────────────────
# STEP 15: DOCKER NETWORK — CONNECT CONTAINER TO HOST POSTFIX
# ────────────────────────────────────────────────────────────
# Your Node.js backend runs inside Docker but Postfix runs on the host.
# The container needs to reach the host's port 25.
#
# Option A: Use host.docker.internal (Docker 20.10+)
# In emailService.js, set host to: 'host.docker.internal'
#
# Option B: Use the Docker bridge gateway IP
# Find it with: docker network inspect bridge | grep Gateway
# Usually: 172.17.0.1
#
# Option C: Add extra_hosts to docker-compose.yml:

echo ""
echo "Add this to your docker-compose.yml under the dinki-api service:"
echo ""
echo '    extra_hosts:'
echo '      - "host.docker.internal:host-gateway"'
echo ""
echo "Then in emailService.js, use host: 'host.docker.internal'"
echo ""

# After updating docker-compose.yml:
cd /var/www/dinki
docker compose up -d --build


# ────────────────────────────────────────────────────────────
# STEP 16: SET UP AUTO-RENEWAL FOR MAIL SSL
# ────────────────────────────────────────────────────────────

# Certbot auto-renew cron (likely already set up)
systemctl list-timers | grep certbot

# Add a post-renewal hook to reload mail services
cat > /etc/letsencrypt/renewal-hooks/post/reload-mail.sh << 'RENEWAL'
#!/bin/bash
systemctl reload postfix
systemctl reload dovecot
RENEWAL
chmod +x /etc/letsencrypt/renewal-hooks/post/reload-mail.sh


echo ""
echo "============================================"
echo "  Mail server setup complete!"
echo "  Don't forget to add DNS records (see below)"
echo "============================================"
