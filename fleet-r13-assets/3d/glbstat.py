import json,struct,sys
from pathlib import Path
def stat(p):
    b=Path(p).read_bytes()
    magic,ver,length=struct.unpack_from('<4sII',b,0)
    assert magic==b'glTF',magic
    clen,ctype=struct.unpack_from('<II',b,12)
    assert ctype==0x4E4F534A,hex(ctype)
    j=json.loads(b[20:20+clen])
    tris=0
    for m in j.get('meshes',[]):
        for pr in m['primitives']:
            mode=pr.get('mode',4)
            if 'indices' in pr: n=j['accessors'][pr['indices']]['count']
            else: n=j['accessors'][pr['attributes']['POSITION']]['count']
            if mode==4: tris+=n//3
            elif mode in (5,6): tris+=max(0,n-2)
    return {'file':str(p),'bytes':len(b),'faces':tris}
for a in sys.argv[1:]:
    print(json.dumps(stat(a)))
