#!/bin/sh

npx prisma@5.22.0 migrate deploy

HOSTNAME="0.0.0.0" node server.js
