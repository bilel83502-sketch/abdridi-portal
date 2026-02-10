export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f7fb"
    }}>
      <div style={{
        padding: 32,
        width: 360,
        background: "white",
        borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ marginBottom: 8 }}>Connexion</h1>
        <p style={{ marginBottom: 24, color: "#555" }}>
          Connectez-vous pour accéder au dashboard.
        </p>

        <form>
          <label>Email</label>
          <input
            type="email"
            placeholder="admin@abdridi.com"
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          />

          <label>Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••"
            style={{ width: "100%", padding: 8, marginBottom: 24 }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              background: "#111827",
              color: "white",
              borderRadius: 6
            }}
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
