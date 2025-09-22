#!/bin/sh

npx prisma@6.4.1 migrate deploy
npx prisma@6.4.1 db seed

HOSTNAME="0.0.0.0" node server.js
