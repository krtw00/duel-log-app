```mermaid
erDiagram
    USER ||--o{ DECK : owns
    USER ||--o{ DUEL : has
    USER ||--o{ SHAREDURL : has
    DECK ||--o{ DUEL : used_in

    USER {
        username
        passwordhash
        createdat
        updatedat
    }

    DECK {
        name
        createdat
        updatedat
    }

    DUEL {
        result
        rank
        coin
        firstorsecond
        dateplayed
        notes
        createdat
        updatedat
    }

    SHAREDURL {
        yearmonth
        url
        createdat
        updatedat
    }
```
