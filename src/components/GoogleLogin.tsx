import { GoogleLogin } from "@react-oauth/google";

interface GoogleSignInProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

export default function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        const token = credentialResponse.credential;
        if (token) {
          onSuccess(token);
        }
      }}
      onError={() => {
        onError?.();
      }}
      theme="outline"
      size="large"
      text="signin_with"
      shape="rectangular"
      useOneTap={false}
      auto_select={false}
    />
  );
}