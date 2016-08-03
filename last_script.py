import sys
s = 0

print "N? "
sys.stdout.flush()
x = input()

while x>0:
    s += x
    print "N? "
    sys.stdout.flush()
    x = input()

print "La suma es: "+str(s)
sys.stdout.flush()
