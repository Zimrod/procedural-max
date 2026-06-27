// api/upload/route.ts
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAwsClient } from "@remotion/lambda/client";

export const POST = async (request: Request) => {
    const json = await request.json();

    const { client, sdk } = getAwsClient({
        region: "ap-south-1",
        service: "s3",
    });

    const command = new sdk.PutObjectCommand({
        Bucket: process.env.REMOTION_AWS_BUCKET_NAME as string,
        Key: crypto.randomUUID(),
        ACL: "public-read",
        ContentLength: json.contentLength,
        ContentType: json.contentType,
    });

    const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ presignedUrl });
}