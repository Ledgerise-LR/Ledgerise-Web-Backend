import bluetooth

def send_cpcl_command(command, device_address):
    port = 1 
    sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
    sock.connect((device_address, port))
    sock.send(command.encode())
    sock.close()


cpcl_command = """! 0 200 200 400 1 
PW 400 
TONE 0 
SPEED 4 
ON-FEED IGNORE 
NO-PACE 
BAR-SENSE 
T 7 0 86 362 <Ledgerise> 
B QR 151 244 M 2 U 6 
MA,110000399754 
ENDQR 
FORM 
PRINT""";

printer_address = "00:00:00:00:00:00"
send_cpcl_command(cpcl_command, printer_address)

