import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        conversations: [],
        unreadMap: {},
        lastFetched: null
    },
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
            state.lastFetched = new Date().toISOString();
        },
        updateConversationPreview: (state, action) => {
            const { groupId, content, senderName, updatedAt } = action.payload;
            const conv = state.conversations.find(c => c._id === groupId);
            if (conv) {
                conv.lastMessage = content;
                conv.lastMessageBy = senderName;
                conv.lastMessageAt = updatedAt || new Date().toISOString();
                // Re-sort
                state.conversations.sort((a, b) => 
                    new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
                );
            }
        },
        incrementUnread: (state, action) => {
            const groupId = action.payload;
            state.unreadMap[groupId] = (state.unreadMap[groupId] || 0) + 1;
        },
        clearUnread: (state, action) => {
            const groupId = action.payload;
            state.unreadMap[groupId] = 0;
        },
        resetChat: (state) => {
            state.conversations = [];
            state.unreadMap = {};
            state.lastFetched = null;
        }
    }
});

export const { 
    setConversations, 
    updateConversationPreview, 
    incrementUnread, 
    clearUnread, 
    resetChat 
} = chatSlice.actions;

export default chatSlice.reducer;
