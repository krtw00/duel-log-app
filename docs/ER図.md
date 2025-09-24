```mermaid
erDiagram
    USER ||--o{ DECK : owns
    USER ||--o{ DUEL : has
    USER ||--o{ SHAREDURL : has
    DECK ||--o{ DUEL : used_in

    USER {
        USERNAME
        PASSWORD_HASH
        CREATED_AT
        UPDATED_AT
    }

    DECK {
        NAME
        CREATED_AT
        UPDATED_AT
    }

    DUEL {
        RESULT  "true=勝ち, false=負け"
        RANK
        COIN    "true=表, false=裏"
        FIRST_OR_SECOND "true=先手, false=後手"
        DATE_PLAYED
        NOTES
        CREATED_AT
        UPDATED_AT
    }

    SHAREDURL {
        YEAR_MONTH
        URL
        CREATED_AT
        UPDATED_AT
    }
```
