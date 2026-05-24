import { GoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api";

export default function GoogleSignIn() {
  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        const token = credentialResponse.credential;

        const res = await api.post("/auth/google", {
          token,
        });

        console.log(res);

        // 👉 Save user + redirect
        localStorage.setItem("user", JSON.stringify(res));

        if (res.role === "OWNER") window.location.href = "/admin";
        else if (res.role === "COORDINATOR") window.location.href = "/admin";
        else if (res.role === "FACULTY") window.location.href = "/faculty";
      }}
      onError={() => {
        console.log("Login Failed");
      }}
    />
  );
}