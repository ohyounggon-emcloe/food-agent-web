import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{"이메일 인증"}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          {"가입하신 이메일로 인증 링크를 발송했습니다."}
        </p>
        <p className="text-gray-600">
          {"메일함을 확인하고 인증 링크를 클릭해주세요."}
        </p>
        <p className="text-sm text-gray-400">
          {"메일이 오지 않으면 스팸함을 확인해주세요."}
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="mt-4">
            {"로그인 페이지로"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
