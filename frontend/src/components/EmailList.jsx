import EmailCard from './EmailCard.jsx';
import EmptyState from './EmptyState.jsx';

export default function EmailList({ messages }) {
  if (!messages?.length) {
    return <EmptyState title="Inbox is empty" detail="Connect and sync your Gmail account to display email data." />;
  }

  return (
    <div className="email-list" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {messages.map((message, index) => (
        <div key={message.id} style={{ animationDelay: `${index * 0.05}s` }}>
          <EmailCard message={message} />
        </div>
      ))}
    </div>
  );
}
