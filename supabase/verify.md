# Supabase RLS verification

Set these shell variables locally. Use only the project URL and **anon/publishable key**; never use a service-role key in a browser or these checks.

```sh
export SUPABASE_URL='https://YOUR_PROJECT_REF.supabase.co'
export SUPABASE_ANON_KEY='YOUR_ANON_KEY'
```

## 1. Anonymous reads only published projects

```sh
curl -sS "$SUPABASE_URL/rest/v1/projects?select=slug,published&order=slug" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Expected: every returned row has `published: true`. The endpoint must not expose unpublished rows.

## 2. Anonymous writes to content tables are rejected

```sh
curl -i -X POST "$SUPABASE_URL/rest/v1/site_content" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"key":"security-test","value":"must fail"}'

curl -i -X PATCH "$SUPABASE_URL/rest/v1/site_content?key=eq.seo.title" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -d '{"value":"must fail"}'

curl -i -X DELETE "$SUPABASE_URL/rest/v1/projects?slug=eq.form-and-field" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Expected: each write is rejected (typically HTTP 401/403 or a permission/RLS error); no rows change.

Also check a different content table for all write methods:

```sh
curl -i -X POST "$SUPABASE_URL/rest/v1/focus_areas" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -d '{"title":"Should fail","copy":"No anonymous writes"}'

curl -i -X PATCH "$SUPABASE_URL/rest/v1/focus_areas?title=eq.AI%20architecture" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -d '{"copy":"Should fail"}'

curl -i -X DELETE "$SUPABASE_URL/rest/v1/focus_areas?title=eq.AI%20architecture" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Expected: all three are rejected and the seeded row remains unchanged.

## 3. Anonymous Storage upload is rejected

```sh
curl -i -X POST "$SUPABASE_URL/storage/v1/object/portfolio/security-test.txt" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: text/plain' --data 'must fail'
```

Expected: rejected. Public object **reads** are allowed; writes require an authenticated user whose UUID exists in `public.admins`.

Storage update and delete must also be rejected:

```sh
curl -i -X PUT "$SUPABASE_URL/storage/v1/object/portfolio/security-test.webp" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: image/webp' --data-binary 'must fail'

curl -i -X DELETE "$SUPABASE_URL/storage/v1/object/portfolio/security-test.webp" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -d '{"prefixes":["security-test.webp"]}'
```

Expected: both are rejected.

## 4. Anonymous can submit a valid message, but cannot read inbox

```sh
curl -i -X POST "$SUPABASE_URL/rest/v1/messages" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -H 'Prefer: return=minimal' \
  -d '{"name":"RLS test","email":"rls-test@example.com","subject":"RLS verification","message":"This is a valid test message."}'

curl -i "$SUPABASE_URL/rest/v1/messages?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Expected: insert succeeds (normally HTTP 201 with `return=minimal`), read fails or returns no accessible data. Delete the test message later while logged in as admin.
