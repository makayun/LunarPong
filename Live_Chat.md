🔹 1. Direct Messages (Приватные сообщения) - ✅


🔹 2. Block Users (Блокировка пользователей) - ✅


🔹 3. Invite to Pong (Приглашение в игру Pong) - ✅

Надо соединить с турнирами - 🔥

🔹 4. Tournament Notifications (Уведомления от системы) - 🔥

Система (например, сервер турниров) должна уметь отправлять уведомления пользователям о предстоящих играх.

Как это должно работать:

Через WebSocket сервер (или отдельный процесс турниров) отправляет сообщение всем пользователям:
{ type: "notify", content: "Next match: CalmBook vs QuickKey at 18:00" }

Клиенты получают и отображают сообщение как системное:
[System] Next match: CalmBook vs QuickKey at 18:00


🔹 5. View Profiles (Просмотр профиля пользователя) - ✅

Надо соединить с базой данных - 🔥
