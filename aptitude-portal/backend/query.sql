SELECT u.username, u.role, u."isActive", LEFT(u."passwordHash", 10) AS hash_prefix, s."rollNumber", s.name
FROM "User" u
LEFT JOIN "Student" s ON s."userId" = u.id
LIMIT 10;
