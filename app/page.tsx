import SignUpForm from '@/app/components/Auth/SignUpForm';
import LoginForm from '@/app/components/Auth/LoginForm';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Attendance App</h1>
      <SignUpForm />
      <LoginForm />
    </div>
  );
}