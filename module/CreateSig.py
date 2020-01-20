import sys
import getopt
import time
import json
import random
import hashlib
from collections import OrderedDict


def main(argv):
    print(argv[1]);
    print(argv[2]);
    encoded = json.dumps(argv[1]).replace(' ', '')
    user_key = argv[2]
    secret = "0O0jSQkN+vU9VOilJsnEpXabfxEuwTl8CLIwYJYNFfRcsFeMW/H+8lKKe1EhV0mELSWc5lFkQRUOLlCNKxIpQg=="
    data = user_key + secret + encoded
    signature = hashlib.md5(data.encode()).hexdigest()[0:10]
    print(signature)

if __name__ == "__main__":
    main(sys.argv)
