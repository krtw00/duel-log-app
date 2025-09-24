``` pgsql
User
----
id (PK)
username
password_hash
created_at
updated_at
      | 1:N
      |
Deck
----
id (PK)
user_id (FK)
name
created_at
updated_at
      | 1:N
      |
Duel
----
id (PK)
user_id (FK)
deck_id (FK)
result        # bool (true=勝ち, false=負け)
rank
coin          # bool (true=表, false=裏)
first_or_second # bool (true=先手, false=後手)
date_played
notes
created_at
updated_at
      | 1:N
      |
SharedURL
----
id (PK)
user_id (FK)
year_month
url           # UUIDなど
created_at
updated_at
```