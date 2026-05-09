"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  limit,
  doc,
  updateDoc
} from "firebase/firestore";
import { Send, User as UserIcon, Search, MessageSquare, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface ChatUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  photoURL?: string;
}

export default function ChatView() {
  const { user } = useAuth();
  const [targetUsers, setTargetUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(true);
  const [rolFiltro, setRolFiltro] = useState<string>("");
  const [activeChats, setActiveChats] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Definir roles permitidos según el rol del usuario logueado
  const getRolesPermitidos = () => {
    if (!user) return [];
    const userRole = (user.role as string)?.toLowerCase();
    
    if (userRole === "superadmin") return ["admin"];
    if (userRole === "admin") return ["superadmin", "barbero", "cliente"];
    if (userRole === "barbero") return ["admin", "cliente"];
    if (userRole === "cliente" || userRole === "usuario") return ["barbero", "admin"];
    return [];
  };

  const rolesPermitidos = getRolesPermitidos();

  // Escuchar chats activos para ver el último mensaje
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snap) => {
      const chatsMap: Record<string, any> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        const otherParticipant = data.participants.find((p: string) => p !== user.uid);
        if (otherParticipant) {
          chatsMap[otherParticipant] = {
            id: doc.id,
            ...data
          };
        }
      });
      setActiveChats(chatsMap);
    });

    return () => unsubscribe();
  }, [user]);

  // Establecer el primer rol permitido como filtro inicial
  useEffect(() => {
    if (rolesPermitidos.length > 0 && !rolFiltro) {
      setRolFiltro(rolesPermitidos[0]);
    }
  }, [rolesPermitidos, rolFiltro]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Fetch reachable users based on role
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "usuarios");
        const userRole = (user.role as string)?.toLowerCase();
        let q;

        // Permissions Logic
        if (userRole === "superadmin") {
          q = query(usersRef, where("role", "==", "admin"));
        } else if (userRole === "admin") {
          q = query(usersRef, where("role", "in", ["superadmin", "barbero", "cliente", "usuario"]));
        } else if (userRole === "barbero") {
          q = query(usersRef, where("role", "in", ["admin", "cliente", "usuario"]));
        } else if (userRole === "cliente" || userRole === "usuario") {
          q = query(usersRef, where("role", "in", ["barbero", "admin"]));
        }

        if (q) {
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => {
            const data = doc.data();
            return { 
              uid: doc.id, 
              ...data,
              // Mapear 'rol' de Firestore a 'role' de nuestra interfaz
              role: data.rol || data.role || "usuario" 
            } as ChatUser;
          });
          setTargetUsers(list);
        }
      } catch (e) {
        console.error("Error fetching users:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // 2. Listen to messages for the selected chat
  useEffect(() => {
    if (!user || !selectedUser) {
      setMessages([]);
      return;
    }

    // Unique chat ID (sorted UIDs to keep it consistent)
    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(list);
    });

    return () => unsubscribe();
  }, [user, selectedUser]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;

    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    const msgsRef = collection(db, "chats", chatId, "messages");
    
    const msgData = {
      text: newMessage,
      senderId: user.uid,
      senderName: user.nombre || user.displayName || user.email?.split("@")[0] || "Usuario",
      createdAt: serverTimestamp(),
    };

    setNewMessage("");
    try {
      await addDoc(msgsRef, msgData);
      // Update chat metadata for list (last message)
      const chatDocRef = doc(db, "chats", chatId);
      const updateData = {
        lastMessage: newMessage,
        lastSenderId: user.uid,
        lastSenderName: msgData.senderName,
        updatedAt: serverTimestamp(),
        participants: [user.uid, selectedUser.uid]
      };

      await updateDoc(chatDocRef, updateData).catch(async () => {
        // If doc doesn't exist, create it
        const { setDoc } = await import("firebase/firestore");
        await setDoc(chatDocRef, updateData);
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const getRoleLabel = (r: string) => {
    if (r === "cliente" || r === "usuario") return "Clientes";
    if (r === "barbero") return "Barberos";
    if (r === "admin") return "Administradores";
    if (r === "superadmin") return "Super Admins";
    return r + "s";
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-[var(--card)] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Sidebar: Users List */}
      <div className={`${showUserList ? "w-full md:w-80" : "hidden md:flex md:w-80"} border-r border-white/5 flex flex-col bg-white/[0.02]`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black text-[var(--white)] flex items-center gap-2">
            <MessageSquare className="text-[var(--gold)]" />
            Mensajería
          </h2>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input 
              type="text" 
              placeholder="Buscar contacto..." 
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Tabs de Roles */}
          <div className="flex flex-wrap gap-1 mb-4 p-1 bg-white/5 rounded-xl">
            {rolesPermitidos.map((r) => (
              <button
                key={r}
                onClick={() => setRolFiltro(r)}
                className={`flex-1 py-2 text-[10px] px-2 font-black uppercase tracking-wider rounded-lg transition-all min-w-[80px] ${
                  rolFiltro === r 
                    ? "bg-[var(--gold)] text-[var(--dark)] shadow-md" 
                    : "text-[var(--muted)] hover:text-[var(--white)] hover:bg-white/5"
                }`}
              >
                {getRoleLabel(r)}
              </button>
            ))}
          </div>

          {targetUsers.filter(u => u.role === rolFiltro || (rolFiltro === "cliente" && u.role === "usuario")).length === 0 ? (
            <p className="text-center text-xs text-[var(--muted)] mt-8">No hay {getRoleLabel(rolFiltro).toLowerCase()} disponibles.</p>
          ) : (
            targetUsers
              .filter(u => u.role === rolFiltro || (rolFiltro === "cliente" && u.role === "usuario"))
              .map((u) => {
                const chat = activeChats[u.uid];
                const isNew = chat && chat.lastSenderId !== user?.uid && (!selectedUser || selectedUser.uid !== u.uid);

                return (
                  <button
                    key={u.uid}
                    onClick={() => {
                      setSelectedUser(u);
                      setShowUserList(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative group ${
                      selectedUser?.uid === u.uid 
                        ? "bg-[var(--gold)] text-[var(--dark)] shadow-lg shadow-[var(--gold)]/20" 
                        : "hover:bg-white/5 text-[var(--white)]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${selectedUser?.uid === u.uid ? "bg-[var(--dark)]/20" : "bg-white/10"}`}>
                      <UserIcon size={20} />
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-[var(--card)] rounded-full animate-bounce"></span>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm truncate">{u.displayName || u.email.split("@")[0]}</p>
                        {chat?.updatedAt && (
                          <span className={`text-[9px] opacity-50 ${selectedUser?.uid === u.uid ? "text-[var(--dark)]" : "text-[var(--muted)]"}`}>
                            {new Date(chat.updatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      {chat?.lastMessage ? (
                        <p className={`text-xs truncate font-medium ${selectedUser?.uid === u.uid ? "text-[var(--dark)]/70" : isNew ? "text-[var(--gold)] font-bold" : "text-[var(--muted)]"}`}>
                          {chat.lastSenderId === user?.uid ? "Tú: " : ""}{chat.lastMessage}
                        </p>
                      ) : (
                        <p className={`text-[10px] uppercase font-black tracking-widest opacity-60 ${selectedUser?.uid === u.uid ? "text-[var(--dark)]" : "text-[var(--gold)]"}`}>
                          {u.role}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!showUserList ? "w-full" : "hidden md:flex md:flex-1"} flex flex-col bg-white/[0.01]`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
              <button 
                onClick={() => setShowUserList(true)}
                className="md:hidden p-2 text-[var(--gold)]"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)]">
                <UserIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--white)]">{selectedUser.displayName || selectedUser.email}</h3>
                <p className="text-[10px] text-[var(--gold)] uppercase font-black tracking-widest">{selectedUser.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => {
                const isMine = m.senderId === user?.uid;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      isMine 
                        ? "bg-[var(--gold)] text-[var(--dark)] font-medium rounded-tr-none shadow-lg shadow-[var(--gold)]/10" 
                        : "bg-white/5 text-[var(--white)] border border-white/5 rounded-tl-none"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-[var(--white)] outline-none focus:border-[var(--gold)]/50 transition-all"
              />
              <button 
                type="submit"
                className="p-3 bg-[var(--gold)] text-[var(--dark)] rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-[var(--gold)]/20"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-[var(--gold)]/20">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-black text-[var(--white)]">Bandeja de Entrada</h3>
            <p className="text-sm text-[var(--muted)] max-w-xs mt-2">Selecciona un contacto de la lista para iniciar una conversación segura.</p>
          </div>
        )}
      </div>
    </div>
  );
}
