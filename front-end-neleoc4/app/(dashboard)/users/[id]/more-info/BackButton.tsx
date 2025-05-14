import { useRouter } from 'next/navigation';
import './backButton.css';

export default function BackButton() {
  const router = useRouter();

  return (
    <button className="back-button" onClick={() => router.push('/users')}>
      Назад 
    </button>
  );
}
