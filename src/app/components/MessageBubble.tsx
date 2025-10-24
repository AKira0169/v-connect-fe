'use client';
export default function MessageBubble({ message }: any) {
  const isMine = message.sender.id === 'CURRENT_USER_ID'; // Replace with your logic
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-4 py-2 ${
          isMine ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
        } wrap-break max-w-xs`}
      >
        {message.content}
      </div>
    </div>
  );
}
