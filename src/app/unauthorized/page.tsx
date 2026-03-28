import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            {"접근 권한 없음"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {"이 페이지에 접근할 권한이 없습니다."}
          </p>
          <p className="text-sm text-gray-400">
            {"관리자 권한이 필요합니다. 관리자에게 문의하세요."}
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="mt-4">
              {"로그인 페이지로"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
