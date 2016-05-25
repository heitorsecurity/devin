using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EstruturasRepeticao01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Qual é o valor exibido no seguinte código
            // 256, 64, 128 ou 512?
            int total = 2;
            for(int i = 0; i < 5; i += 1)
            {
                total = total * 2;
            }
            MessageBox.Show("O total é: " + total);
        }

        private void button2_Click(object sender, EventArgs e)
        {
            // Faça um programa em C# que imprima a soma dos números de 1 até 1000.
            int total = 0;
            int totalSoma = 0;
            for (int i = 1; i <= 1000; i += 1)
            {
                total = total + 1;
                totalSoma = total + totalSoma;
            }
            MessageBox.Show("Soma de 1 até 1000: " + totalSoma);
        }

        private void button3_Click(object sender, EventArgs e)
        {
            // Faça um programa em C# que imprima todos os múltiplos de 3, entre 1 e 100.
            // Para saber se um número é múltiplo de 3, você pode fazer if(numero % 3 == 0).
            int numero = 0;
            for (int i = 1; i <= 100; i += 1)
            {
                numero = numero + 1;
                if (numero % 3 == 0)
                {
                    MessageBox.Show("O número " + numero + " é múltiplo de 3");
                }
            }
        }

        private void button4_Click(object sender, EventArgs e)
        {
            // (Opcional) Escreva um programa em C# que some todos os números de 1 a 100,
            // pulando os múltiplos de 3. O programa deve imprimir o resultado final
            // em um MessageBox.
            // Qual o resultado?
            int total = 0;
            int numero = 0;
            for (int i = 1; i <= 100; i += 1)
            {
                numero = numero + 1;
                if (numero % 3 == 1)
                {
                    total = total + numero;
                }
            }
            MessageBox.Show("Soma de todos os numeros de 1 ate 100 pulando os multiplos de 3: " + total);
        }

        private void button5_Click(object sender, EventArgs e)
        {
            // (Opcional) Escreva um programa em C# que
            // imprime todos os números que são divisíveis por
            // 3 ou por 4 entre 0 e 30.
            int numero = 0;
            for (int i = 0; i <= 30; i += 1)
            {
                numero += 1;
                if (numero % 3 == 0)
                {
                    MessageBox.Show("Divisivel por 3: " + numero);
                }
                else if (numero % 4 == 0)
                {
                    MessageBox.Show("Divisivel por 4: " + numero);
                }
            }
        }

        private void button6_Click(object sender, EventArgs e)
        {
            // (Opcional) Faça um programa em C# que imprima os fatoriais de
            // 1 a 10. O fatorial de um número n é n * n-1 * n-2 ... até n = 1.
            // O fatorial de 0 é 1
            // O fatorial de 1 é(0!) * 1 = 1
            // O fatorial de 2 é(1!) * 2 = 2
            // O fatorial de 3 é(2!) * 3 = 6
            // O fatorial de 4 é(3!) * 4 = 24
            // Faça um for que inicie uma variável n(número) como 1 e
            // fatorial(resultado) como 1 e varia n de 1 até 10:
            // int fatorial = 1;
            // for (int n = 1; n <= 10; n++)
            // {
            // 
            // }
            int fatorial = 1;
            int resultado = 0;
            for (int n = 1;n <= 10; n++)
            {
                fatorial = n * (n - 1);
                MessageBox.Show("Fatorial de " + n + " é " + fatorial);
            }
    }

        private void button7_Click(object sender, EventArgs e)
        {
            // (Opcional) Faça um programa em C# que imprima os primeiros
            // números da série de Fibonacci até passar de 100. A série de
            // Fibonacci é a seguinte: 0, 1, 1, 2, 3, 5, 8, 13, 21 etc...
            // Para calculá-la, o primeiro elemento vale 0, o segundo vale 1,
            // daí por diante, o n-ésimo elemento vale o (n-1)-ésimo elemento
            // somado ao (n-2)-ésimo elemento (ex: 8 = 5 + 3).
        }

        private void button8_Click(object sender, EventArgs e)
        {
            // (Opcional) Faça um programa que imprima a seguinte tabela,
            // usando fors encadeados:
            // 1
            // 2 4
            // 3 6 9
            // 4 8 12 16
            // n n*2 n * 3....n * n
        }
    }
}
