const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMessage() {
  console.log('🔐 Logging in as test1@example.com...');

  // Login as test1
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test1@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in as:', authData.user.email);

  // Get test1 and test2 user IDs
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', ['test1@example.com', 'test2@example.com']);

  const test1 = users.find(u => u.email === 'test1@example.com');
  const test2 = users.find(u => u.email === 'test2@example.com');

  console.log('👤 Test1 ID:', test1.id);
  console.log('👤 Test2 ID:', test2.id);

  // Create or get conversation
  console.log('💬 Creating conversation...');
  const conversationResponse = await fetch('http://localhost:3000/api/messages/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`
    },
    body: JSON.stringify({
      buyer_id: test1.id,
      seller_id: test2.id
    })
  });

  const conversationData = await conversationResponse.json();
  console.log('💬 Conversation:', conversationData);

  if (!conversationData.conversation_id) {
    console.error('❌ Failed to create conversation');
    return;
  }

  const conversationId = conversationData.conversation_id;

  // Send message
  console.log('📤 Sending message...');
  const messageResponse = await fetch(`http://localhost:3000/api/messages/${conversationId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`
    },
    body: JSON.stringify({
      content: 'Hello from test1 to test2! This is a test message.'
    })
  });

  const messageData = await messageResponse.json();
  console.log('📤 Message response status:', messageResponse.status);
  console.log('📤 Message response:', JSON.stringify(messageData, null, 2));

  if (messageResponse.status === 500) {
    console.error('❌ Message send failed with 500 error');
  } else {
    console.log('✅ Message sent successfully!');
  }
}

testMessage().catch(console.error);
