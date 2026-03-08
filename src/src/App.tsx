import React, { useState, useRef } from 'react';
import { User, Group, Message, PrivateMessage } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPrivateUser, setSelectedPrivateUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex min-h-screen">
      <div className="w-80 bg-gray-100 p-4">
        <h2 className="font-bold mb-4">Groups</h2>
        {groups.map(group => (
          <button key={group.id} onClick={() => setSelectedGroup(group)}>
            {group.name}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4 bg-white flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {(selectedGroup ? messages : privateMessages).map((msg, idx) => (
            <div key={idx}>{msg.content}</div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mt-2">
          <input 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)} 
            className="flex-1 border rounded p-2" 
            placeholder="Type a message..." 
          />
          <button className="bg-blue-600 text-white px-4 rounded">Send</button>
        </form>
      </div>
    </div>
  );
}
