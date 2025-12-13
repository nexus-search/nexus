"""
Email service for sending transactional emails.
Supports SMTP and multiple providers (Gmail, SendGrid, AWS SES, etc.)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

class EmailService:
    """Service for sending emails via SMTP"""

    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
        self.enabled = bool(self.smtp_server and self.smtp_username and self.smtp_password)
        self.executor = ThreadPoolExecutor(max_workers=3)

    def _send_email_sync(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Synchronous email sending (runs in thread pool)"""
        if not self.enabled:
            print(f"📧 Email disabled - Would send to {to_email}: {subject}")
            return False

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email

            # Add text and HTML parts
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)

            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            print(f"✅ Email sent to {to_email}: {subject}")
            return True

        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
            return False

    async def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Async email sending"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self._send_email_sync,
            to_email,
            subject,
            html_content,
            text_content
        )

    async def send_password_reset_email(self, to_email: str, reset_token: str, username: str):
        """Send password reset email"""
        reset_url = f"{settings.FRONTEND_ORIGIN}/auth/reset-password?token={reset_token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #e60023; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #e60023; color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hi {username},</p>
                    <p>We received a request to reset your password for your Nexus account.</p>
                    <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">{reset_url}</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>This is an automated email from Nexus. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Hi {username},

        We received a request to reset your password for your Nexus account.

        Click this link to reset your password (expires in 1 hour):
        {reset_url}

        If you didn't request this, you can safely ignore this email.

        ---
        This is an automated email from Nexus. Please do not reply.
        """

        return await self.send_email(
            to_email=to_email,
            subject="Reset Your Nexus Password",
            html_content=html_content,
            text_content=text_content
        )

    async def send_welcome_email(self, to_email: str, username: str):
        """Send welcome email to new users"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #e60023; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #e60023; color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Nexus!</h1>
                </div>
                <div class="content">
                    <p>Hi {username},</p>
                    <p>Welcome to Nexus! We're excited to have you on board.</p>
                    <p>Start discovering and saving creative ideas today.</p>
                    <p style="text-align: center;">
                        <a href="{settings.FRONTEND_ORIGIN}" class="button">Explore Now</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Hi {username},

        Welcome to Nexus! We're excited to have you on board.

        Start discovering and saving creative ideas today.

        Visit: {settings.FRONTEND_ORIGIN}
        """

        return await self.send_email(
            to_email=to_email,
            subject="Welcome to Nexus!",
            html_content=html_content,
            text_content=text_content
        )


# Singleton instance
email_service = EmailService()
