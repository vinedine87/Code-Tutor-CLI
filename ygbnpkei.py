# ygbnpkei.py - 파이썬 구구단 (1~9)
# 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.
def main():  # 프로그램의 시작점이 되는 함수 정의
    for i in range(1, 10):  # i는 1부터 9까지(행에 해당)
        line = []  # 한 줄에 출력할 문자열들을 담을 리스트
        for j in range(1, 10):  # j는 1부터 9까지(열에 해당)
            line.append(f"{i} x {j} = {i*j}")  # f-문자열로 'i x j = 결과' 형태 추가
        print('   '.join(line))  # 리스트를 공백 3칸으로 이어서 한 줄로 출력

            
if __name__ == "__main__":  # 이 파일을 직접 실행했을 때만
    main()  # main() 함수를 호출하여 프로그램 시작