import { useParams } from 'react-router-dom';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Комната {id}</h1>
      </div>
    </div>
  );
}