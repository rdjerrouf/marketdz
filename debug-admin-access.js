#!/usr/bin/env node

// Debug script to check current authentication and admin status

console.log('🔍 Admin Access Debug Tool');
console.log('==========================');

console.log('\n📋 Step-by-step debugging guide:');

console.log('\n1. First, check if you are signed in:');
console.log('   Open browser console and run:');
console.log('   ```javascript');
console.log('   supabase.auth.getUser().then(({data}) => console.log("Current user:", data.user))');
console.log('   ```');

console.log('\n2. If no user, sign in first:');
console.log('   - Go to http://localhost:3000/signin');
console.log('   - Sign in with rdjerrouf@gmail.com (or test@example.com)');
console.log('   - Then try accessing admin again');

console.log('\n3. If signed in, test admin API:');
console.log('   ```javascript');
console.log('   fetch("/api/admin/check-status")');
console.log('     .then(r => r.json())');
console.log('     .then(data => console.log("Admin status:", data))');
console.log('     .catch(err => console.error("Admin check failed:", err))');
console.log('   ```');

console.log('\n4. Check browser console for errors:');
console.log('   - Look for any red error messages');
console.log('   - Check for authentication failures');
console.log('   - Look for network request failures');

console.log('\n5. Expected flow:');
console.log('   ✅ User should be authenticated');
console.log('   ✅ Admin API should return {isAdmin: true}');
console.log('   ✅ Admin layout should load without redirecting');

console.log('\n6. Common issues:');
console.log('   ❌ Not signed in → go to /signin first');
console.log('   ❌ Wrong email → use rdjerrouf@gmail.com or test@example.com');
console.log('   ❌ API returns 401 → authentication cookies missing');
console.log('   ❌ API returns 403 → email not in admin list');

console.log('\n7. Manual test URLs:');
console.log('   🔐 Sign in: http://localhost:3000/signin');
console.log('   🏠 Home: http://localhost:3000');
console.log('   👑 Admin: http://localhost:3000/admin');

console.log('\n8. If admin layout keeps redirecting:');
console.log('   - Check browser console for admin layout debug messages');
console.log('   - Look for "🚨 ADMIN LAYOUT BREAKPOINT" messages');
console.log('   - These will show exactly where the flow fails');

console.log('\n🔧 Next steps:');
console.log('   1. Try the debugging steps above');
console.log('   2. Report back what you see in browser console');
console.log('   3. Let me know which step fails');