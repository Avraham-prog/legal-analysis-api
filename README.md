# Legal Analysis API

שרת Node.js שמבצע ניתוח משפטי על בסיס חוק זכויות יוצרים בישראל, דרך OpenAI API.

## הפעלה

1. התקן את התלויות:
```
npm install
```

2. הוסף קובץ `.env` עם הערכים:
```
OPENAI_API_KEY=...
LEGAL_ANALYSIS_API_KEY=...
```

3. הפעל את השרת:
```
npm start
```

## שימוש

בצע POST ל- `/analyze` עם JSON:
```json
{ "url": "https://..." }
```

ושדה Authorization:
```
Bearer your-LEGAL_ANALYSIS_API_KEY
```
