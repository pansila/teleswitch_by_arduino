from flask import Flask, url_for
from flask import render_template
from flask import request
import serial
import logging
from flask import jsonify
import json
import time

app = Flask(__name__)
ser = None
portnum = 14
userdb = None
#dbfile = None
dbfilepath = "./database.json"

@app.route("/")
def hello(database=None):
	return render_template('index.html', database=userdb, portnum=portnum)

@app.route("/update", methods=['POST'])
def update():
	ret = request.get_json()
	global userdb
	userdb = ret
	with open(dbfilepath, "w") as dbfile:
		try:
			validate_data()
		except Exception as msg:
			app.logger.warning(msg)
		finally:
			json.dump(userdb, dbfile, indent=4, sort_keys=True)
	return jsonify(userdb)

@app.route("/load")
def loaddata():
	with open(dbfilepath, "r+") as dbfile:
		global userdb
		userdb = json.load(dbfile)
		try:
			validate_data()
		except Exception as msg:
			app.logger.warning(msg)
			dbfile.seek(0)
			json.dump(userdb, dbfile, indent=4, sort_keys=True)
			dbfile.truncate()
	return jsonify(userdb)

@app.route("/control", methods=['POST'])
def control():
	global ser
	port = request.get_json()
	if ser is not None:
		try:
			num = int(port["portnum"])
			num -= 1
			if port["status"]:
				cmd = "#" + str(num) + ":0\n"
			else:
				cmd = "#" + str(num) + ":1\n"
			ser.write(cmd)
		except Exception as msg:
			app.logger.warning(msg)
	return jsonify(port)

def validate_data():
	allports = {}
	delports = {}
	for user in userdb:
		for port in userdb[user]:
			if port in allports.keys():
				delports[user] = port
			else:
				allports[port] = 1

	for user in delports:
		del userdb[user][delports[user]]
	if len(delports) != 0:
		raise Exception("conflicted config" + str(delports))

if __name__ == "__main__":
	with open(dbfilepath, "r+") as dbfile:
		userdb = json.load(dbfile)
		try:
			validate_data()
		except Exception as msg:
			print msg
			dbfile.seek(0)
			json.dump(userdb, dbfile, indent=4, sort_keys=True)
			dbfile.truncate()
	if ser is None:
		try:
			ser = serial.Serial("/dev/ttyACM0",
					9600,
					timeout=0,
					parity=serial.PARITY_NONE,
					rtscts=0,
					stopbits=serial.STOPBITS_ONE,
					bytesize=serial.EIGHTBITS)
			time.sleep(5)
			print("initialize the ports as config file")
			for u in userdb:
				#print(u)
				for p in userdb[u]:
					state = int(userdb[u][p]["state"])
					state = 0 if state else 1
					num = int(p) - 1
					cmd = "#" + str(num) + ":" + str(state) + "\n"
					#print(cmd)
					time.sleep(0.5)
					ser.write(cmd)
		except Exception as msg:
			ser = None
			print(msg)
	app.run(
		debug=False,
		host="0.0.0.0",
		port=5000
	)
	try:
		print("closing serial device")
		ser.close()
	except Exception as msg:
		print(msg)
