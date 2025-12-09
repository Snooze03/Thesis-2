from django.core.management.base import BaseCommand
from ...services.email_service import EmailService


class Command(BaseCommand):
    help = "Test email sending functionality"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email address to send test to")

    def handle(self, *args, **options):
        email = options["email"]
        test_otp = "123456"

        self.stdout.write(f"Sending test OTP email to {email}...")

        success = EmailService.send_otp_email(email, test_otp)

        if success:
            self.stdout.write(
                self.style.SUCCESS(f"✓ Email sent successfully to {email}")
            )
        else:
            self.stdout.write(self.style.ERROR(f"✗ Failed to send email to {email}"))
