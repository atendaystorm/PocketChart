import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
    const [, navigate] = useLocation();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!token) {
            return setError("This password reset link is missing its token.");
        }

        if (password.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Unable to reset password.");
                return;
            }

            setMessage(
                data.message || "Your password has been reset successfully."
            );

            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch {
            setError("Unable to connect to the server.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className= "min-h-screen flex items-center justify-center p-6" >
        <div className="w-full max-w-md space-y-6" >
            <div>
            <h1 className="text-2xl font-bold" > Reset Password </h1>
                < p className = "text-sm text-muted-foreground mt-1" >
                    Enter your new password below.
          </p>
                        </div>

                        < form onSubmit = { handleResetPassword } className = "space-y-4" >
                            <div className="space-y-2" >
                                <Label htmlFor="new-password" > New Password </Label>
                                    < Input
    id = "new-password"
    type = "password"
    value = { password }
    onChange = { e => setPassword(e.target.value) }
    placeholder = "Enter new password"
    autoComplete = "new-password"
        />
        </div>

        < div className = "space-y-2" >
            <Label htmlFor="confirm-password" > Confirm Password </Label>
                < Input
    id = "confirm-password"
    type = "password"
    value = { confirmPassword }
    onChange = { e => setConfirmPassword(e.target.value) }
    placeholder = "Confirm new password"
    autoComplete = "new-password"
        />
        </div>

    {
        error && (
            <p className="text-sm text-destructive" >
            { error }
                </p>
          )
    }

    {
        message && (
            <p className="text-sm text-green-600" >
            { message }
                </p>
          )
    }

    <Button
            type="submit"
    className = "w-full font-semibold"
    disabled = { submitting }
        >
    { submitting? "Resetting...": "Set New Password" }
        </Button>
        </form>
        </div>
        </div>
  );
}