#!/usr/bin/env bash

#add help function
if [ "$1" == "-h" ] ; then
    echo "Usage: -u {username} -p {password}"
    exit 0
fi

#parse options
while getopts u:p: option
do
case "${option}"
in
u) USER=${OPTARG};;
p) PASSWORD=${OPTARG};;
esac
done

DIR=`date +%Y%m%d`

mongodump -h ds121189.mlab.com:21189 -d onexys_blue -u ${USER} -p ${PASSWORD} -o ${DIR}

mongodump -h ds121189.mlab.com:21189 -d onexys_gray -u ${USER} -p ${PASSWORD} -o ${DIR}

mongodump -h ds015924.mlab.com:15924 -d onexys_physics -u ${USER} -p ${PASSWORD} -o ${DIR}

mongodump -h ds157614.mlab.com:57614 -d onexys_white -u ${USER} -p ${PASSWORD} -o ${DIR}