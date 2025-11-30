# Architecture Summary

## Project Structure

```
interveu/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # (To be added: Reusable UI components matching Figma)
│   │   ├── pages/         # Page components (Home, Teacher, Student)
│   │   ├── hooks/         # Custom React hooks (useSocket)
│   │   ├── socket/        # Socket.io client setup
│   │   ├── types/         # TypeScript type definitions
│   │   └── styles/        # Global CSS with CSS variables
│   └── package.json
│
├── backend/               # Express + Socket.io backend
│   ├── src/
│   │   ├── routes/        # (Optional: REST API routes)
│   │   ├── socket/        # Socket.io event handlers
│   │   ├── types/         # TypeScript type definitions
│   │   └── server.ts      # Main server file
│   └── package.json
│
└── README.md
```

## Data Flow

### Teacher Flow
1. Teacher opens `/teacher` route
2. Socket.io connection established
3. Teacher creates question → `teacher:create_question` event
4. Backend validates and creates poll
5. Backend broadcasts `server:question_updated` to all clients
6. Backend starts timer, emits `server:timer_tick` every second
7. As students answer, backend emits `server:results_updated`
8. When timer expires or all answered → `server:question_closed`

### Student Flow
1. Student opens `/student` route
2. Student enters name (stored in localStorage)
3. Socket.io connection established, `student:join` event sent
4. Student receives `server:question_updated` if question exists
5. Student selects option and submits → `student:submit_answer`
6. Backend validates (one answer per student per question)
7. Backend updates results and broadcasts
8. Student sees results after answering or when question closes

## State Management

### Frontend
- React Context/Hooks for local component state
- Socket.io events for real-time updates
- localStorage for student name persistence

### Backend
- In-memory store for active question and students
- Single source of truth for timer (backend)
- PollQuestion uses Set for answeredBy (converted to array for transmission)

## Socket.io Events

### Client → Server
- `student:join` - Student joins with name
- `teacher:create_question` - Create new poll
- `student:submit_answer` - Submit answer
- `teacher:end_question` - Manually end poll

### Server → Client
- `server:question_updated` - New/updated question
- `server:results_updated` - Updated vote counts
- `server:timer_tick` - Countdown updates
- `server:question_closed` - Question closed

## Key Design Decisions

1. **Single Active Question**: Only one question can be active at a time
2. **Backend Timer**: Timer logic handled on backend to prevent client manipulation
3. **Student Identity**: Simple localStorage-based identity per browser tab
4. **Set Serialization**: PollQuestion.answeredBy is a Set internally but serialized as array for Socket.io
5. **No Authentication**: Simple name-based identification for MVP

## Next Steps for Figma Integration

1. Extract colors, typography, and spacing from Figma
2. Update CSS variables in `frontend/src/styles/global.css`
3. Create reusable components matching Figma design system
4. Update page layouts to match Figma exactly
5. Add responsive breakpoints if specified in Figma

## Future Enhancements (Bonus Features)

1. **Database Persistence**: Store poll history in PostgreSQL/MongoDB
2. **Past Results View**: Teacher can view historical polls
3. **Chat Feature**: Real-time chat between teacher and students
4. **Student Removal**: Teacher can remove students from session
5. **Multiple Rooms**: Support for multiple concurrent poll sessions

