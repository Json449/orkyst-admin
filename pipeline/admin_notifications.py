from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from html import escape
from pathlib import Path
from typing import Any


DEACTIVATION_COPY_EMAIL = "sarfarazahmedkhan08@gmail.com"
SUPPORT_EMAIL = "moazzam@orkyst.com"
ROOT = Path(__file__).resolve().parents[1]
LOGO_PATHS = (
    ROOT / "pipeline" / "assets" / "orkyst-logo.png",
)


def _load_logo_asset() -> tuple[bytes, str, str] | None:
    for path in LOGO_PATHS:
        if not path.exists():
            continue
        return path.read_bytes(), "png", path.name
    return None


def _status_palette(active: bool) -> dict[str, str]:
    if active:
        return {
            "accent": "#166534",
            "soft": "#ECFDF5",
            "soft_border": "#A7F3D0",
            "text": "#14532D",
            "tag_bg": "#D1FAE5",
            "tag_text": "#166534",
        }
    return {
        "accent": "#A30D70",
        "soft": "#FFF1F6",
        "soft_border": "#F5B7D7",
        "text": "#7E174F",
        "tag_bg": "#FCE9F3",
        "tag_text": "#A30D70",
    }


def _build_account_status_email(
    user: dict[str, Any],
    *,
    active: bool,
    sender_email: str | None,
    logo_content_id: str | None,
) -> tuple[str, str]:
    palette = _status_palette(active)
    accent = palette["accent"]
    soft = palette["soft"]
    soft_border = palette["soft_border"]
    text_color = palette["text"]
    tag_bg = palette["tag_bg"]
    tag_text = palette["tag_text"]
    display_name = escape(str(user.get("fullname") or "").strip() or "there")
    recipient_email = escape(str(user.get("email") or "").strip())
    sender_label = escape(str(sender_email or "Orkyst Admin").strip() or "Orkyst Admin")
    logo_html = (
        f'<img src="cid:{logo_content_id}" alt="Orkyst" width="132" '
        'style="display:block;width:132px;max-width:132px;height:auto;border:0;outline:none;text-decoration:none;" />'
        if logo_content_id
        else '<span style="font-size:32px;font-weight:800;color:#7A0860;">Orkyst</span>'
    )

    subject_status = "activated" if active else "deactivated"
    status_title = "Account activated" if active else "Account deactivated"
    status_sentence = (
        "Your Orkyst account has been activated. You can sign in and use your account again."
        if active
        else "Your Orkyst account has been deactivated. You will not be able to sign in while it remains deactivated."
    )
    action_sentence = (
        "This account is active again, so sign in should work normally."
        if active
        else "Access to this account is currently paused until an administrator reactivates it."
    )
    plain_text = "\n".join(
        [
            f"Hi {display_name},",
            "",
            status_sentence,
            "",
            action_sentence,
            "",
            f"Updated by: {sender_label}",
            f"Account email: {recipient_email}",
            "",
            f"If you think this change was made in error, please contact Orkyst support at {SUPPORT_EMAIL}.",
            "",
            "Thank you,",
            "The Orkyst Team",
        ]
    )

    html = f"""<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F8F5F8;font-family:Segoe UI,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#F8F5F8;padding:40px 20px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">
          <tr><td align="center" style="padding:0 0 24px;">{logo_html}</td></tr>
          <tr><td style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(122,8,96,0.08);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="height:6px;background-color:#7A0860;font-size:0;line-height:0;">&nbsp;</td></tr>
              <tr><td style="padding:36px 40px 32px;">
                <p style="margin:0 0 10px;color:{accent};text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Account status update</p>
                <h1 style="margin:0 0 14px;color:#080A0B;text-align:center;font-size:25px;line-height:1.3;font-weight:700;">{status_title}</h1>
                <p style="margin:0;color:#5A5A5A;text-align:center;font-size:15px;line-height:1.65;">Hi {display_name}, {status_sentence}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;background-color:{soft};border:1px solid {soft_border};border-radius:12px;">
                  <tr><td style="padding:20px 22px;">
                    <p style="margin:0 0 7px;color:{accent};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Status details</p>
                    <p style="margin:0;color:{text_color};font-size:16px;line-height:1.55;font-weight:700;">{action_sentence}</p>
                  </td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;background-color:#FBF8FB;border:1px solid #F0E8EF;border-radius:12px;">
                  <tr><td style="padding:16px 18px;color:#5A5A5A;font-size:13px;line-height:1.7;">
                    <strong style="color:#080A0B;">Updated by:</strong> {sender_label}<br />
                    <strong style="color:#080A0B;">Account email:</strong> {recipient_email}
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#F0E8EF;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
              <tr><td style="padding:22px 40px 32px;">
                <p style="margin:0;color:#8D8D8D;text-align:center;font-size:13px;line-height:1.6;">Having trouble or think this change was made in error? Contact Orkyst support at <a href="mailto:{SUPPORT_EMAIL}" style="color:#7A0860;text-decoration:none;font-weight:700;">{SUPPORT_EMAIL}</a></p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding:28px 20px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:12px;">{logo_html}</td></tr></table>
            <p style="margin:0 0 7px;color:#6F6872;text-align:center;font-size:12px;line-height:1.5;">Orkyst - Transform Marketing Chaos into Results</p>
            <p style="margin:0;color:#A19AA3;text-align:center;font-size:11px;line-height:1.55;">You received this email because an administrator updated your Orkyst account.<br /><a href="mailto:{SUPPORT_EMAIL}" style="color:#7A0860;text-decoration:none;">{SUPPORT_EMAIL}</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""

    return plain_text, html


def send_account_status_email(
    user: dict[str, Any],
    *,
    active: bool,
    sender_email: str | None,
) -> bool:
    """Email the account holder about an admin account-status change."""
    recipient = str(user.get("email") or "").strip()
    if not recipient:
        return False

    gmail_user = os.getenv("GMAIL_USER", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "").strip() or ("smtp.gmail.com" if gmail_user else "")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "").strip() or gmail_user
    if not smtp_host or not smtp_from_email:
        return False

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "").strip() or gmail_user
    smtp_password = os.getenv("SMTP_PASSWORD", "") or os.getenv("GMAIL_PASSWORD", "")
    use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() not in {"0", "false", "no", "off"}

    sender_name = os.getenv("SMTP_FROM_NAME", "Orkyst")
    subject_status = "activated" if active else "deactivated"

    message = EmailMessage()
    message["Subject"] = f"Your Orkyst account has been {subject_status}"
    message["From"] = formataddr((sender_name, smtp_from_email))
    message["To"] = recipient

    cc_emails = [str(sender_email or "").strip()]
    if not active:
        cc_emails.append(DEACTIVATION_COPY_EMAIL)

    recipients = [recipient]
    recipient_keys = {recipient.lower()}
    copied_emails: list[str] = []
    for cc_email in cc_emails:
        cc_key = cc_email.lower()
        if cc_email and cc_key not in recipient_keys:
            copied_emails.append(cc_email)
            recipients.append(cc_email)
            recipient_keys.add(cc_key)
    if copied_emails:
        message["Cc"] = ", ".join(copied_emails)

    logo_asset = _load_logo_asset()
    logo_content_id = make_msgid()[1:-1] if logo_asset else None
    plain_text, html_body = _build_account_status_email(
        user,
        active=active,
        sender_email=sender_email,
        logo_content_id=logo_content_id,
    )
    message.set_content(plain_text)
    message.add_alternative(html_body, subtype="html")
    if logo_asset and logo_content_id:
        logo_bytes, logo_subtype, logo_filename = logo_asset
        message.get_payload()[-1].add_related(
            logo_bytes,
            maintype="image",
            subtype=logo_subtype,
            cid=f"<{logo_content_id}>",
            filename=logo_filename,
            disposition="inline",
        )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as smtp:
        if use_tls:
            smtp.starttls()
        if smtp_username:
            smtp.login(smtp_username, smtp_password)
        smtp.send_message(message, to_addrs=recipients)

    return True
