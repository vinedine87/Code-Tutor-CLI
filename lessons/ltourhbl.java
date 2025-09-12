// ltourhbl.java - 자바 구구단 (1~9)
// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.
public class Ltourhbl {  // 클래스 이름은 파일명과 동일해야 합니다
    public static void main(String[] args) {  // 자바 프로그램의 진입점
        for (int i = 1; i <= 9; i++) {  // i는 1부터 9까지(행)
            StringBuilder line = new StringBuilder();  // 한 줄을 담을 버퍼
            for (int j = 1; j <= 9; j++) {  // j는 1부터 9까지(열)
                line.append(i).append(" x ").append(j).append(" = ")
                    .append(i*j);  // 'i x j = 결과' 이어 붙이기
                if (j < 9) line.append("   ");  // 항목 사이 간격 3칸
            }
            System.out.println(line.toString());  // 한 줄 출력
        }
    }
}