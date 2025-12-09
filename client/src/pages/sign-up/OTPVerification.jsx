import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useVerifyOTP } from "@/hooks/authentication/useVerifyOTP";
import { useResendOTP } from "@/hooks/authentication/useResendOTP";

export function OTPVerification({ email, onVerified, onClose }) {
    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds cooldown

    // OTP hooks
    const { mutate: verifyOTP, isPending: isVerifying } = useVerifyOTP();
    const { mutate: resendOTP, isPending: isResending } = useResendOTP();

    // Timer countdown (10 minutes)
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Resend cooldown timer
    useEffect(() => {
        if (!canResend && resendCooldown > 0) {
            const cooldownTimer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(cooldownTimer);
        }
    }, [canResend, resendCooldown]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Handle OTP verification
    const handleVerify = () => {
        if (otp.length !== 6) {
            return;
        }

        verifyOTP(
            { email, otp },
            {
                onSuccess: (data) => {
                    // Pass verification token back to parent
                    onVerified(data.data.verification_token);
                },
            }
        );
    };

    // Handle resend OTP
    const handleResend = () => {
        if (!canResend || isResending) return;

        resendOTP(email, {
            onSuccess: () => {
                // Reset states
                setOtp("");
                setTimeLeft(600); // Reset timer to 10 minutes
                setCanResend(false);
                setResendCooldown(60);
            },
        });
    };

    // Auto-verify when 6 digits are entered
    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    return (
        <AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-md gap-2">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center">
                        Email Verification
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-2">
                        <>
                            We sent a verification code to{" "}
                            <span className="font-semibold text-foreground">{email}</span>
                        </>
                    </AlertDialogDescription>
                    <p className="text-xs text-center">
                        Time remaining:{" "}
                        <span className="font-mono font-semibold text-foreground">
                            {formatTime(timeLeft)}
                        </span>
                    </p>
                </AlertDialogHeader>

                <div className="flex flex-col items-center space-y-3 py-4">
                    <InputOTP
                        maxLength={6}
                        pattern={REGEXP_ONLY_DIGITS}
                        value={otp}
                        onChange={setOtp}
                        disabled={isVerifying || timeLeft === 0}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>

                    {timeLeft === 0 && (
                        <p className="text-sm text-destructive text-center">
                            Code expired. Please request a new one.
                        </p>
                    )}

                    <p className="text-sm text-muted-foreground">
                        Didn't receive a code?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={!canResend || isResending || timeLeft === 0}
                            className={cn(
                                "font-semibold underline underline-offset-2 hover:text-primary transition-colors",
                                (!canResend || isResending || timeLeft === 0) &&
                                "opacity-50 cursor-not-allowed hover:text-muted-foreground"
                            )}
                        >
                            {isResending
                                ? "Sending..."
                                : canResend
                                    ? "Resend"
                                    : `Resend in ${resendCooldown}s`}
                        </button>
                    </p>
                </div>

                <AlertDialogFooter className="flex flex-col sm:flex-col gap-2">
                    <Button
                        className="w-full"
                        onClick={handleVerify}
                        disabled={otp.length !== 6 || isVerifying || timeLeft === 0}
                    >
                        {isVerifying ? "Verifying..." : "Verify Code"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={onClose}
                        disabled={isVerifying || isResending}
                    >
                        Cancel
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}