
import { useState } from "react";
import { createUserProfile } from "../services/marketplace";
import "./RoleSetupModal.css";

export default function RoleSetupModal({ user, onComplete }) {
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const profile = await createUserProfile(user, role);
      onComplete(profile);
    } catch (err) {
      console.error("Profile creation failed:", err);
      setError(
        err.code === "permission-denied"
          ? "Firestore denied access. Check that you published the security rules."
          : err.message || "Could not create your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ks-role-overlay">
      <form className="ks-role-modal" onSubmit={handleContinue}>
        <span className="ks-role-eyebrow">WELCOME TO KALASETU</span>

        <h2>How will you use KalaSetu?</h2>

        <p className="ks-role-description">
          Choose the account type that best describes you. You can explore
          handcrafted products as a buyer or sell your creations as an artisan.
        </p>

        <button
          type="button"
          className={`ks-role-option ${
            role === "buyer" ? "selected" : ""
          }`}
          onClick={() => setRole("buyer")}
          disabled={loading}
          aria-pressed={role === "buyer"}
        >
          <span className="ks-role-icon" aria-hidden="true">🛍️</span>
          <span className="ks-role-option-text">
            <strong>I'm a Buyer</strong>
            <small>Discover crafts, save favourites, and shop.</small>
          </span>
          <span className="ks-role-check">
            {role === "buyer" ? "✓" : ""}
          </span>
        </button>

        <button
          type="button"
          className={`ks-role-option ${
            role === "artisan" ? "selected" : ""
          }`}
          onClick={() => setRole("artisan")}
          disabled={loading}
          aria-pressed={role === "artisan"}
        >
          <span className="ks-role-icon" aria-hidden="true">🎨</span>
          <span className="ks-role-option-text">
            <strong>I'm an Artisan</strong>
            <small>Showcase handmade products and manage your shop.</small>
          </span>
          <span className="ks-role-check">
            {role === "artisan" ? "✓" : ""}
          </span>
        </button>

        {error && (
          <p className="ks-role-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="ks-role-continue"
          disabled={loading}
        >
          {loading ? "Setting up your account..." : "Continue"}
        </button>

        <p className="ks-role-footnote">
          Your account type is saved to your KalaSetu profile.
        </p>
      </form>
    </div>
  );
}
