<script lang="ts">
    import { enhance } from '$app/forms';
    
    type FormResult = {
        success?: boolean;
        message?: string;
    }

    let {data, form} = $props<{ form?: FormResult }>();
    let bucketName = $state('');
    
    // 폼 제출 후 처리
    $effect(() => {
        if (form?.success) {
            // 성공 메시지 표시
            alert(form.message || '버킷이 생성되었습니다');
            bucketName = '';
            // 페이지 새로고침하여 데이터 갱신
            window.location.reload();
        } else if (form?.message) {
            // 오류 메시지 표시
            alert(form.message);
        }
    });
</script>

<div class="container">
    <h1>MinIO 브라우저</h1>
    
    <div class="main-content">
        <div class="left-panel">
            <h3>버킷 생성</h3>
            <form method="POST" action="?/createBucket" use:enhance>
                <div class="form-group">
                    <input type="text" name="bucketName" bind:value={bucketName} placeholder="버킷 이름 입력">
                    <button type="submit">버킷 생성</button>
                </div>
            </form>
            
            <div class="bucket-list">
                <h3>버킷 목록</h3>
                {#if data.buckets && data.buckets.length > 0}
                    <ul>
                        {#each data.buckets as bucket}
                            <li>
                                <a href="/browser/{bucket.Name}">{bucket.Name}</a>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="no-buckets">버킷이 없습니다. 새 버킷을 생성해주세요.</p>
                {/if}
            </div>
        </div>
        
        <div class="right-panel">
            <div class="welcome-box">
                <h2>MinIO S3 브라우저에 오신 것을 환영합니다</h2>
                <p>왼쪽에서 버킷을 선택하거나 새 버킷을 생성하세요.</p>
                <p>이 애플리케이션은 MinIO 서버와 연동하여 S3 호환 스토리지를 관리합니다.</p>
                
                <div class="connection-status">
                    <h4>연결 상태</h4>
                    {#if data.connected}
                        <div class="status connected">✅ 연결됨</div>
                    {:else}
                        <div class="status disconnected">❌ 연결 안됨</div>
                        {#if data.error}
                            <div class="error-message">{data.error}</div>
                        {/if}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    
    h1 {
        text-align: center;
        margin-bottom: 30px;
        color: #333;
    }
    
    .main-content {
        display: flex;
        gap: 30px;
    }
    
    .left-panel {
        flex: 1;
        border-right: 1px solid #ddd;
        padding-right: 20px;
    }
    
    .right-panel {
        flex: 2;
    }
    
    .form-group {
        display: flex;
        margin-bottom: 20px;
    }
    
    input {
        flex: 1;
        padding: 10px;
        margin-right: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    button {
        padding: 10px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    button:hover {
        background-color: #45a049;
    }
    
    .no-buckets {
        margin: 20px 0;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 4px;
        color: #666;
    }
    
    .bucket-list {
        margin-top: 30px;
    }
    
    .bucket-list ul {
        list-style-type: none;
        padding: 0;
    }
    
    .bucket-list li {
        margin-bottom: 10px;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .bucket-list li:hover {
        background-color: #f0f0f0;
    }
    
    .bucket-list a {
        text-decoration: none;
        color: #007bff;
        display: block;
        font-size: 16px;
    }
    
    .bucket-list a:hover {
        text-decoration: underline;
    }
    
    .welcome-box {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .connection-status {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
    }
    
    .status {
        padding: 8px 12px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 10px;
    }
    
    .connected {
        background-color: #d4edda;
        color: #155724;
    }
    
    .disconnected {
        background-color: #f8d7da;
        color: #721c24;
    }
    
    .error-message {
        color: #721c24;
        background-color: #f8d7da;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
    }
</style>