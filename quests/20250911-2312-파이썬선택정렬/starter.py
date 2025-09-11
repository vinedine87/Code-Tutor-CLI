# 입력: 첫 줄에 N, 둘째 줄에 N개 정수
# 최대값 출력
import sys

_ = sys.stdin.readline()
nums = list(map(int, sys.stdin.readline().split()))
print(max(nums))
