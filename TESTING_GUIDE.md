# Virtual Class Testing Guide

## ✅ Fixes Applied

1. **Camera/Mic cleanup** - Fixed
2. **Grade matching** - Fixed  
3. **Teacher can join** - Fixed
4. **Class end redirect** - Fixed

## 🎯 How to Test (Step by Step)

### Step 1: Start Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

Wait for both to start successfully.

---

### Step 2: Open Two Browser Windows

**Window 1 - Teacher (Chrome Normal):**
1. Go to: `http://localhost:3000`
2. Login: `t_g1_2465` / `password123`
3. Click "Virtual Classes" from sidebar
4. Click "INITIATE_NEW_SESSION"
5. Fill form:
   - Title: "Test Class"
   - Subject: "Math"
   - Grade: Select "GRADE 1"
   - Duration: 60
   - Schedule: Pick current date/time (or few minutes ahead)
   - Description: "Testing"
6. Click "CONFIRM_CREATE"
7. Click "START_SESSION" button
8. Click "JOIN" button to enter video session
9. **Allow camera and microphone when browser asks**

**Window 2 - Student (Chrome Incognito - Press Ctrl+Shift+N):**
1. Go to: `http://localhost:3000`
2. Login: `s_g1_1_9537` / `password123`
3. Click "Virtual Classes" from sidebar
4. You should see the class created by teacher
5. Click "JOIN_LIVE_FEED"
6. **Allow camera and microphone when browser asks**

---

### Step 3: Test Features

**✅ Video/Audio:**
- Both should see each other's video
- Check participant count shows "2 ONLINE"
- Click participants icon to see list

**✅ Chat:**
- Click chat icon
- Send messages from both sides
- Messages should appear in real-time

**✅ Controls:**
- Test mute/unmute microphone
- Test video on/off
- Check if camera light turns off when disabled

**✅ End Class:**
- Teacher: Click "Leave Class" → Camera should stop
- OR Teacher: Go back and click "END" button
- Student should see "Class ended" notification
- Student's camera should stop automatically

---

## 🔧 Troubleshooting

### Issue: "Camera not accessible"
**Solution:** 
- Make sure you're using `localhost:3000` (not 127.0.0.1 or IP address)
- Click the camera icon in browser address bar
- Allow camera/microphone permissions
- Refresh the page

### Issue: "Can't see other participant's video"
**Possible causes:**
1. **Firewall blocking WebRTC** - Temporarily disable firewall
2. **Browser doesn't support WebRTC** - Use Chrome/Firefox
3. **Both users joined too quickly** - Leave and rejoin after 5 seconds

**Quick fix:**
- Both users leave the class
- Teacher joins first, wait 5 seconds
- Student joins second

### Issue: "Class not visible to student"
**Check:**
- Teacher created class with grade "1"
- Student has standard "1th Grade" (check GENERATED_USERS.md)
- Class status is "live" (teacher clicked START)

### Issue: "Port 5000 already in use"
**Solution:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

---

## 📝 Test Checklist

- [ ] Teacher can create class
- [ ] Teacher can start class
- [ ] Teacher can join video session
- [ ] Student can see available classes
- [ ] Student can join live class
- [ ] Both can see each other's video
- [ ] Participant count is correct
- [ ] Chat works bidirectionally
- [ ] Mute/unmute works
- [ ] Video on/off works
- [ ] Teacher can end class
- [ ] Student gets notified when class ends
- [ ] Camera/mic stops when leaving
- [ ] Camera/mic stops when class ends

---

## 🎥 Expected Behavior

### When Teacher Starts Class:
1. Class status changes to "LIVE"
2. "START_SESSION" button changes to "JOIN" and "END"
3. Students can now see the class

### When Anyone Joins:
1. Browser asks for camera/microphone permission
2. User's own video appears
3. Socket connects to server
4. Other participants receive notification
5. WebRTC peer connection establishes
6. Remote video appears (may take 2-5 seconds)

### When Teacher Ends Class:
1. All participants get "class-ended" event
2. Everyone's camera/mic stops
3. Everyone redirects to dashboard after 2 seconds
4. Class status changes to "ended"

---

## 🚨 Known Limitations

1. **Screen sharing** - Basic implementation, doesn't broadcast to peers yet
2. **Reconnection** - If connection drops, need to rejoin manually
3. **Mobile** - Works but may have performance issues
4. **Multiple students** - Works but video quality may degrade with 5+ participants

---

## 💡 Tips for Best Results

1. **Use Chrome** - Best WebRTC support
2. **Use localhost** - Required for camera access
3. **Good internet** - At least 2 Mbps upload/download
4. **Close other apps** - Reduce CPU/bandwidth usage
5. **Join one at a time** - Wait 5 seconds between joins
6. **Check browser console** - Look for errors if issues occur

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check server terminal for errors
3. Verify both servers are running
4. Try different browser/incognito mode
5. Restart both servers

---

**Status: Ready for Testing! 🚀**
