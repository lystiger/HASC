// frontend/src/pages/PrivacyPolicyPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage: React.FC = () => {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage === 'vi' ? 'vn' : 'en';

  return (
    <div className="container mx-auto min-h-screen max-w-screen-xl px-6 py-10 font-sans">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          {activeLanguage === 'vn' ? 'Pháp lý' : 'Legal'}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-industrial">
          {activeLanguage === 'vn' ? 'Chính Sách Bảo Mật' : 'Privacy Policy'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          {activeLanguage === 'vn'
            ? 'Trang này cung cấp chính sách bảo mật chính thức bằng tiếng Việt và tiếng Anh để đảm bảo minh bạch.'
            : 'This page provides the official privacy policy in Vietnamese and English for clarity and transparency.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeLanguage === 'vn' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
            <h2 className="text-2xl font-semibold text-slate-900">Chính Sách Bảo Mật (VN)</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed">
            <p>
              Cám ơn quý khách đã quan tâm và truy cập vào website. Chúng tôi tôn trọng và cam kết sẽ bảo mật
              những thông tin mang tính riêng tư của Quý khách.
            </p>
            <p>
              Chính sách bảo mật sẽ giải thích cách chúng tôi tiếp nhận, sử dụng và (trong trường hợp nào đó)
              tiết lộ thông tin cá nhân của Quý khách.
            </p>
            <p>
              Bảo vệ dữ liệu cá nhân và gây dựng được niềm tin cho quý khách là vấn đề rất quan trọng với chúng tôi.
              Vì vậy, chúng tôi sẽ dùng tên và các thông tin khác liên quan đến quý khách tuân thủ theo nội dung của
              Chính sách bảo mật. Chúng tôi chỉ thu thập những thông tin cần thiết liên quan đến giao dịch mua bán.
            </p>
            <p>
              Chúng tôi sẽ giữ thông tin của khách hàng trong thời gian luật pháp quy định hoặc cho mục đích nào đó.
              Quý khách có thể truy cập vào website và trình duyệt mà không cần phải cung cấp chi tiết cá nhân. Lúc đó,
              Quý khách đang ẩn danh và chúng tôi không thể biết bạn là ai nếu Quý khách không đăng nhập vào tài khoản
              của mình.
            </p>

            <h3 className="text-lg font-semibold text-slate-900">1. Thu thập thông tin cá nhân</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Chúng tôi thu thập, lưu trữ và xử lý thông tin của bạn cho quá trình mua hàng và cho những thông báo sau
                này liên quan đến đơn hàng, và để cung cấp dịch vụ, bao gồm một số thông tin cá nhân: danh hiệu, tên,
                giới tính, ngày sinh, email, địa chỉ, địa chỉ giao hàng, số điện thoại, fax, chi tiết thanh toán, chi
                tiết thanh toán bằng thẻ hoặc chi tiết tài khoản ngân hàng.
              </li>
              <li>
                Chúng tôi sẽ dùng thông tin quý khách đã cung cấp để xử lý đơn đặt hàng, cung cấp các dịch vụ và thông
                tin yêu cầu thông qua website và theo yêu cầu của bạn.
              </li>
              <li>
                Hơn nữa, chúng tôi sẽ sử dụng các thông tin đó để quản lý tài khoản của bạn; xác minh và thực hiện giao
                dịch trực tuyến, nhận diện khách vào web, nghiên cứu nhân khẩu học, gửi thông tin bao gồm thông tin sản
                phẩm và dịch vụ. Nếu quý khách không muốn nhận bất cứ thông tin tiếp thị của chúng tôi thì có thể từ
                chối bất cứ lúc nào.
              </li>
              <li>
                Chúng tôi có thể chuyển tên và địa chỉ cho bên thứ ba để họ giao hàng cho bạn (ví dụ cho bên chuyển phát
                nhanh hoặc nhà cung cấp).
              </li>
              <li>
                Chi tiết đơn đặt hàng của bạn được chúng tôi lưu giữ nhưng vì lí do bảo mật nên chúng tôi không công khai
                trực tiếp được. Tuy nhiên, quý khách có thể tiếp cận thông tin bằng cách đăng nhập tài khoản trên web.
                Tại đây, quý khách sẽ thấy chi tiết đơn đặt hàng của mình, những sản phẩm đã nhận và những sản phẩm đã
                gửi và chi tiết email, ngân hàng và bản tin mà bạn đặt theo dõi dài hạn.
              </li>
              <li>
                Quý khách cam kết bảo mật dữ liệu cá nhân và không được phép tiết lộ cho bên thứ ba. Chúng tôi không chịu
                bất kỳ trách nhiệm nào cho việc dùng sai mật khẩu nếu đây không phải lỗi của chúng tôi.
              </li>
              <li>
                Chúng tôi có thể dùng thông tin cá nhân của bạn để nghiên cứu thị trường. Mọi thông tin chi tiết sẽ được
                ẩn và chỉ được dùng để thống kê. Quý khách có thể từ chối không tham gia bất cứ lúc nào.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900">2. Bảo mật</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Chúng tôi có biện pháp thích hợp về kỹ thuật và an ninh để ngăn chặn truy cập trái phép hoặc trái pháp
                luật hoặc mất mát hoặc tiêu hủy hoặc thiệt hại cho thông tin của bạn.
              </li>
              <li>
                Chúng tôi khuyên quý khách không nên đưa thông tin chi tiết về việc thanh toán với bất kỳ ai bằng e-mail,
                chúng tôi không chịu trách nhiệm về những mất mát quý khách có thể gánh chịu trong việc trao đổi thông tin
                của quý khách qua internet hoặc email.
              </li>
              <li>
                Quý khách tuyệt đối không sử dụng bất kỳ chương trình, công cụ hay hình thức nào khác để can thiệp vào hệ
                thống hay làm thay đổi cấu trúc dữ liệu. Nghiêm cấm việc phát tán, truyền bá hay cổ vũ cho bất kỳ hoạt
                động nào nhằm can thiệp, phá hoại hay xâm nhập vào dữ liệu của hệ thống website. Mọi vi phạm sẽ bị tước
                bỏ mọi quyền lợi cũng như sẽ bị truy tố trước pháp luật nếu cần thiết.
              </li>
              <li>
                Mọi thông tin giao dịch sẽ được bảo mật nhưng trong trường hợp cơ quan pháp luật yêu cầu, chúng tôi sẽ
                buộc phải cung cấp những thông tin này cho các cơ quan pháp luật.
              </li>
            </ul>

            <p>
              Các điều kiện, điều khoản và nội dung của trang web này được điều chỉnh bởi luật pháp Việt Nam và tòa án
              Việt Nam có thẩm quyền xem xét.
            </p>

            <h3 className="text-lg font-semibold text-slate-900">3. Quyền lợi khách hàng</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Quý khách có quyền yêu cầu truy cập vào dữ liệu cá nhân của mình, có quyền yêu cầu chúng tôi sửa lại những
                sai sót trong dữ liệu của bạn mà không mất phí.
              </li>
              <li>
                Bất cứ lúc nào bạn cũng có quyền yêu cầu chúng tôi ngưng sử dụng dữ liệu cá nhân của bạn cho mục đích tiếp
                thị.
              </li>
            </ul>
            </div>
          </section>
        )}

        {activeLanguage === 'en' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
            <h2 className="text-2xl font-semibold text-slate-900">Privacy Policy (EN)</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed">
            <p>
              Thank you for your interest in and visit to our website. We respect and are committed to protecting your
              personal information.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, and (in certain cases) disclose your personal information.
            </p>
            <p>
              Protecting personal data and building trust with our customers is extremely important to us. Therefore, we
              will use your name and other related information in accordance with the contents of this Privacy Policy. We
              only collect information that is necessary for sales transactions.
            </p>
            <p>
              We will retain customer information for the period required by law or for a specific purpose. You may access
              and browse the website without providing personal details. In such cases, you remain anonymous and we cannot
              identify you unless you log in to your account.
            </p>

            <h3 className="text-lg font-semibold text-slate-900">1. Collection of Personal Information</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                We collect, store, and process your information for order processing and for notifications related to your
                orders, as well as to provide services. This may include certain personal information such as: title, name,
                gender, date of birth, email address, address, delivery address, phone number, fax number, payment details,
                credit/debit card details, or bank account details.
              </li>
              <li>
                We use the information you provide to process orders, deliver services, and supply information requested
                through the website or as requested by you.
              </li>
              <li>
                In addition, we use this information to manage your account; verify and carry out online transactions;
                identify visitors to the website; conduct demographic research; and send information including product and
                service updates. If you do not wish to receive marketing information from us, you may opt out at any time.
              </li>
              <li>
                We may transfer your name and address to third parties for delivery purposes (for example, courier services
                or suppliers).
              </li>
              <li>
                Your order details are stored by us, but for security reasons cannot be publicly disclosed. However, you may
                access this information by logging into your account on the website. There, you can view details of your
                orders, products received and shipped, as well as your email, banking information, and any newsletters you
                have subscribed to.
              </li>
              <li>
                You are responsible for keeping your personal data confidential and must not disclose it to third parties.
                We are not responsible for any misuse of your password if it is not caused by our fault.
              </li>
              <li>
                We may use your personal information for market research purposes. All details will be anonymized and used
                solely for statistical analysis. You may opt out at any time.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900">2. Security</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                We implement appropriate technical and security measures to prevent unauthorized or unlawful access, loss,
                destruction, or damage to your information.
              </li>
              <li>
                We advise you not to share payment details with anyone via email. We are not responsible for any losses you
                may incur when exchanging information over the internet or via email.
              </li>
              <li>
                You are strictly prohibited from using any programs, tools, or other methods to interfere with the system or
                alter data structures. Any act of distributing, promoting, or encouraging activities that interfere with,
                damage, or unlawfully access the website’s data is strictly prohibited. Any violation will result in the
                termination of all related rights and may be prosecuted under the law if necessary.
              </li>
              <li>
                All transaction information is kept confidential; however, in cases where required by law enforcement
                authorities, we will be obliged to provide such information to the relevant authorities.
              </li>
            </ul>

            <p>
              The terms, conditions, and content of this website are governed by the laws of Vietnam, and Vietnamese courts
              shall have jurisdiction.
            </p>

            <h3 className="text-lg font-semibold text-slate-900">3. Customer Rights</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You have the right to request access to your personal data and the right to request corrections of any
                inaccuracies in your data free of charge.
              </li>
              <li>
                At any time, you also have the right to request that we stop using your personal data for marketing
                purposes.
              </li>
            </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
