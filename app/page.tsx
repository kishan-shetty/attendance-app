import { supabase } from '@/supabaseClient';

async function fetchUsers() {
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return null;
  }

  console.log('Fetched users:', data);
  return data;
}

export default async function Home() {
  const users = await fetchUsers();

  return (
    <div>
      <h1>Welcome to the Attendance App</h1>
      {users && users.length > 0 ? (
        <pre>{JSON.stringify(users, null, 2)}</pre>
      ) : (
        <p>No users found (yet!). Check your console for any errors.</p>
      )}
    </div>
  );
}