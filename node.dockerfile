FROM        node

MAINTAINER  Nick DelBen

ENV         PORT=3000

WORKDIR     /var/www

EXPOSE      $PORT

CMD         npm run fullserve
