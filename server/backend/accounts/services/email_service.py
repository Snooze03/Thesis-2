from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class EmailService:
    """Service for sending emails, particularly OTP verification emails."""

    @staticmethod
    def send_otp_email(email, otp_code):
        """
        Send OTP verification email to user.

        Args:
            email (str): Recipient email address
            otp_code (str): 6-digit OTP code

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        subject = "Your Verification Code"

        # HTML email content
        html_message = f"""
        <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 3px;
                        background-color: #f9f9f9;
                        border-radius: 10px;
                    }}
                    .header {{
                        background-color: #40b1b5;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px 5px 0 0;
                    }}
                    .content {{
                        background-color: white;
                        padding: 5px 30px 15px;
                        border-radius: 0 0 5px 5px;
                    }}
                    .otp-code {{
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 5px;
                        text-align: center;
                        color: #40b1b5;
                        padding: 20px;
                        background-color: #f0f0f0;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #666;
                    }}
                    .warning {{
                        color: #d32f2f;
                        font-size: 14px;
                        margin-top: 15px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <p>Thank you for signing up. To complete your registration, please use the following verification code:</p>

                        <div class="otp-code">{otp_code}</div>

                        <p>This code will expire in <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.</p>

                        <p class="warning">⚠️ If you didn't request this code, please ignore this email.</p>

                        <div class="footer">
                            <p>This is an automated email, please do not reply.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>

        """

        plain_message = f"""
        Hi!
        
        Welcome to our fitness platform! Your account has been successfully created.
        
        We're excited to help you on your fitness journey!
        
        Get started by exploring your personalized workout plans and nutrition guidance.
        
        Best regards,
        The Fitness Team
        """

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=True,  # Don't fail signup if welcome email fails
            )
            return True
        except Exception as e:
            print(f"Error sending welcome email to {email}: {str(e)}")
            return False
