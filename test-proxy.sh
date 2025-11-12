#!/bin/bash

curl -s 'https://ai-voice-chat-pwa.vercel.app/api/n8n-proxy/api/v1/workflows?limit=1' \
  -H 'Content-Type: application/json' \
  -H 'X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWUxNTIzNy01ZTdiLTQzNmUtYWIzMS0wYmNkOTdmMTM5OGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyODEwOTY4fQ.Ig_gHK27V-reZD5NN4BFxDsWluAK3SIi2GXSXsy-xng' \
  -H 'X-N8N-BASE-URL: https://apipietech.app.n8n.cloud'
