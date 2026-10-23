import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { AUTHORIZED_ADMIN_EMAIL } from "../context/authConstants";
import { AlertCircleIcon, CheckIcon } from "../components/Icons";

export function Login() {
  const { login, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            YASH<span>.</span>
          </div>
          <h2>Admin Control Center</h2>
          <p className="login-subtext">
            Authenticate with your authorized credentials to manage portfolio content.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="alert-box alert-warning">
            <AlertCircleIcon size={18} />
            <div>
              <strong>Supabase Not Configured</strong>
              <p>Please check that .env.local has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-box alert-error" role="alert">
            <AlertCircleIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dixityash2999@gmail.com"
              required
              autoComplete="email"
              disabled={loading || !isSupabaseConfigured}
            />
            <span className="field-hint">
              Only authorized administrator ({AUTHORIZED_ADMIN_EMAIL}) is permitted.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your admin password"
              required
              autoComplete="current-password"
              disabled={loading || !isSupabaseConfigured}
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? "Verifying Credentials..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="login-footer">
          <div className="security-tag">
            <CheckIcon size={14} />
            <span>Protected by Supabase Auth & Row Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
